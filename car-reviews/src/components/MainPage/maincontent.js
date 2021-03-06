import React, { Component } from 'react';
import { Button, Row, Col, Container } from 'reactstrap';
import { Redirect } from 'react-router-dom';

import axios from 'axios';
import ReviewModal from '../Modals/reviewmodal';
import PopularCar from './popularcar';
import './mainpage.css';

const backendURL = process.env.REACT_APP_BACKEND_URL;

// This component generates Review and Reviewer cards. I chose to make the cards using buttons
// because they will need to be clicked on to open the review page. This is rendered in MainPage.

const currentDate = new Date();

const date = currentDate.getDate();
const month = currentDate.getMonth();
const year = currentDate.getFullYear();
const dateString = date + '-' + (month + 1) + '-' + year;

class MainContent extends Component {
  state = {
    popularCars: [],
    reviews: [],
    popularReviewers: [],
    counter: 0,
    newdate: dateString,
    olddate: dateString,
    searchResults: [],
    searching: false
  };

  componentDidMount() {
    const deployedPopCars = `${backendURL}/api/popular/popular_cars`;
    const deployedFeatReviews = `${backendURL}/api/popular/featured_reviews`;
    const deployedPopReviewers = `${backendURL}/api/popular/popular_reviewers`;
    axios
      .all([
        axios.get(deployedPopCars),
        axios.get(deployedFeatReviews),
        axios.get(deployedPopReviewers)
      ])
      .then(
        axios.spread((carsRes, reviewsRes, reviewersRes) => {
          this.setState({
            popularCars: carsRes.data,
            reviews: reviewsRes.data,
            popularReviewers: reviewersRes.data
          });
        })
      )
      .catch(error => {
        console.error('Server Error', error);
      });
  }

  userToSearch = reviewer => {
    axios
      .post(`${backendURL}/api/reviews/search`, { reviewer })
      .then(response => {
        this.setState({ searchResults: response.data }, () => this.setState({ searching: true }));
      })
      .catch(err => {
        console.log('ERROR: ', err.message);
      });
  };

  handleRedirect = () => {
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
    }
  };

  render() {
    return (
      <div className="main-content-container">
        {this.handleRedirect()}
        <div className="main-content">
          <div style={{ height: '20px' }} />
          <Container>
            <h3 className="header">Featured Reviews</h3>
            <Row>
              {this.state.reviews.map(review => {
                return (
                  <Col lg="3" md="6" key={review._id} onClick={this.updateUserCounter}>
                    <ReviewModal {...review} />
                  </Col>
                );
              })}
            </Row>
            <h3 className="header">Popular Cars</h3>
            <Row>
              {this.state.popularCars.map(car => {
                return (
                  <Col lg="3" md="6" key={car._id}>
                    <PopularCar {...car} isLoggedIn={this.props.isLoggedIn} />
                  </Col>
                );
              })}
            </Row>
            <div style={{ height: '50px' }} />
            <h3 className="header">Popular Reviewers</h3>
            <Row style={{ marginTop: '30px' }}>
              {this.state.popularReviewers.map(reviewer => {
                return (
                  <Col lg="3" md="6" key={reviewer._id} style={{ marginBottom: '35px' }}>
                    <Button
                      className="main-card"
                      onClick={() => this.userToSearch(reviewer.username)}
                    >
                      <p>{reviewer.username}</p>
                    </Button>
                  </Col>
                );
              })}
            </Row>
          </Container>
          <div style={{ height: '100px' }} />
        </div>
      </div>
    );
  }
}

export default MainContent;
