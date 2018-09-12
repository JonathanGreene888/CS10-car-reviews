import React, { Component } from 'react';
import Header from './header';
import LeftNavBar from './leftnavbar';
import UserSettings from './usersettings';
import './settings.css';

// This Settings component is a wrapper that contains the Header, LeftNavBar, and UserSettings components within it and when rendered in App presents the Settings view for a user to change name, email, or password.

class Settings extends Component {
  render() {
    return (
      <div>
        <div>
          <Header section={'Settings'} />{' '}
          {/*Passing in the section Settings as props to the Header component*/}
        </div>
        <div className="settingsContainer">
          <LeftNavBar />
          <UserSettings />
        </div>
      </div>
    );
  }
}

export default Settings;
