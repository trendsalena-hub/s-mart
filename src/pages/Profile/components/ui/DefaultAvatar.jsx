import React from 'react';

const DefaultAvatar = ({ name, size = 80 }) => {
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  const colors = ['#c9a86a', '#b89450', '#a8823c'];
  const color = colors[initial.charCodeAt(0) % colors.length];
  
  return (
    <div 
      className="default-avatar"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
    >
      <span className="default-avatar__initial">{initial}</span>
      <div className="default-avatar__decoration">
        <div className="default-avatar__ring"></div>
      </div>
    </div>
  );
};

export default DefaultAvatar;