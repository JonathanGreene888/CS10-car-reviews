import React, { Fragment } from 'react';
import './mainpage.css';
import { Button } from 'reactstrap';
import { Link, Redirect } from 'react-router-dom';
import LoginRegisterModal from '../Modals/loginregistermodal';
import { years } from '../../data';
import axios from 'axios';
import './searchbar.css';

const backendURL = process.env.REACT_APP_BACKEND_URL;

// This is the Search Bar component, made up of sign-up/sign-in buttons, dropdown filters
// for search, and a review button. This file is rendered in MainPage.

class Searchbar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dropdownOpen: false,
      years: [],
      makes: [],
      models: [],
      'car-years': '',
      'car-models': '',
      'car-makes': '',
      'car-edition': '',
      searching: false,
      searchResults: [],
      selectedValues: {
        year: '',
        make: '',
        model: ''
      },
      displayDropdowns: {
        year: false,
        model: false
      },
      modalState: {
        isOpen: false,
        type: 'login'
      }
    };
  }

  convertCSVToMakesArray(csv) {
    let lines = csv.split('\n');

    let answerSet = new Set();

    for (let i = 1; i < lines.length - 1; i++) {
      let currentline = lines[i].split(',');

      currentline = currentline[1];
      currentline = currentline.replace(/['"]+/g, '');
      let capitalizeCurrentLine = currentline.charAt(0).toUpperCase() + currentline.slice(1);
      answerSet.add(capitalizeCurrentLine);
    }

    let answer = Array.from(answerSet);

    return answer;
  }

  componentDidMount() {
    axios
      .get(`https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=csv`)
      .then(res => {
        let responseData = this.convertCSVToMakesArray(res.data);
        this.setState({ makes: responseData || this.state.makes });
      })
      .catch(err => {
        console.warn(err);
        alert('There was an error loading the makes, please reload the page');
      });
  }

  handleChangeMake = e => {
    const { value } = e.target;
    const newMake = {
      make: value,
      makeId: ''
    };
    this.state.makes.map(make => {
      if (make === value) newMake.make = make;
      return newMake;
    });

    const newState = Object.assign({}, this.state);
    newState.selectedValues.make = newMake;
    newState.displayDropdowns.year = true;

    newState.years = years.reverse();
    this.setState(newState);
  };

  handleChangeYear = e => {
    const value = parseInt(e.target.value, 10);
    const { make } = this.state.selectedValues.make;
    const newState = Object.assign({}, this.state);
    newState.selectedValues.year = value;
    newState.displayDropdowns.model = true;
    axios
      .get(
        `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/make/${make}/modelyear/${value}?format=json`
      )
      .then(res => {
        newState.models = res.data.Results;
        this.setState(newState, () => console.log(this.state));
      });
  };

  handleChangeModels = e => {
    const { value } = e.target;
    const newState = Object.assign({}, this.state);
    let modelId;
    this.state.models.map(model => {
      if (value === model.model) modelId = model.model_id;
      return modelId;
    });

    newState.selectedValues.model = { model: value, modelId };
  };

  searchFunction = () => {
    const searchCriteria = {};
    const { year, make, model } = this.state.selectedValues;

    if (this.state.selectedValues.year) {
      searchCriteria.year = this.state.selectedValues.year;
    }
    if (this.state.selectedValues.make) {
      searchCriteria.make = this.state.selectedValues.make.make;
    }
    if (this.state.selectedValues.model) {
      searchCriteria.model = this.state.selectedValues.model.model;
    } else if (!year && !make && !model) {
      console.log(`There are no selected values in the search criteria`);
    }
    axios
      .post(`${backendURL}/api/reviews/search`, searchCriteria)
      .then(response => {
        this.setState({ searchResults: response.data, searching: true });
      })
      .catch(err => {
        console.log('ERROR: ', err.message);
      });
  };

  handleRedirect = page => {
    if (this.state.searching) {
      return (
        <Redirect
          push
          to={{
            pathname: '/searchpage',
            state: {
              isLoggedIn: this.props.isLoggedIn,
              searchResults: this.state.searchResults,
              currentPage: '/searchpage'
            }
          }}
        />
      );
    } else {
      return <Fragment />;
    }
  };

  handleModalState = (modalType, status) => () => {
    const newState = Object.assign({}, this.state);
    newState.modalState.type = modalType;
    newState.modalState.isOpen = status;
    this.setState(newState);
  };

  handleChangeModalType = modalType => {
    const newState = Object.assign({}, this.state);
    newState.modalState.type = modalType;
    this.setState(newState);
  };

  handleReviewButton = () => {
    if (this.props.isLoggedIn) {
      return (
        <div className="searchbar-buttons-container">
          <Link className="searchbar-buttons-links" to="/MyReviews">
            <Button className="searchbar-buttons">Review</Button>
          </Link>
          <div className="searchbar-buttons-links">
            <Button className="searchbar-buttons" onClick={() => this.searchFunction()}>
              Search
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="searchbar-buttons-container">
          <Link to="/login" className="searchbar-buttons-links">
            <Button className="searchbar-buttons" onClick={this.handleModalState('login', true)}>
              Review
            </Button>
          </Link>
          <div className="searchbar-buttons-links">
            <Button className="searchbar-buttons" onClick={() => this.searchFunction()}>
              Search
            </Button>
          </div>
        </div>
      );
    }
  };

  handleSetJwtState = (type, jwt) => {
    localStorage.setItem('jwt', jwt);
    this.props.handleLogin(true);
    this.setState({ modalState: { isOpen: false, type } });
  };

  render() {
    return (
      <div>
        <div style={{ height: '65px' }} />
        <div className="searchbar">
          {this.handleRedirect()}
          <div className="auto-logo">AUTO REVIEW FOR YOU!</div>
          <LoginRegisterModal
            isOpen={this.state.modalState.isOpen}
            type={this.state.modalState.type}
            handleModalState={this.handleModalState}
            handleChangeModalType={this.handleChangeModalType}
            handleSetJwtState={this.handleSetJwtState}
          />
          <div className="searchfields">
            <select className="dropdowns" name="make" onChange={this.handleChangeMake}>
              <option>Select a Make</option>
              {this.state.makes.map(make => {
                return <option key={make}>{make}</option>;
              })}
            </select>

            {this.state.displayDropdowns.year ? (
              <select className="dropdowns" name="year" onChange={this.handleChangeYear}>
                <option>Select a Year</option>
                {this.state.years.map(year => {
                  return <option key={year}>{year}</option>;
                })}
              </select>
            ) : (
              <Fragment />
            )}

            {this.state.displayDropdowns.model ? (
              <select className="dropdowns" name="model" onChange={this.handleChangeModels}>
                <option>Select a Model</option>
                {this.state.models.map(model => {
                  return <option key={model.Model_Name}>{model.Model_Name}</option>;
                })}
              </select>
            ) : (
              <Fragment />
            )}
          </div>

          {this.handleReviewButton()}
        </div>
      </div>
    );
  }
}

export default Searchbar;
