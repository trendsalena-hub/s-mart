import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="profile profile--loading">
      <div className="profile__loader">
        <div className="profile__loader-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;