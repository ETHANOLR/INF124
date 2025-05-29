// components/Button.js
import React from 'react';
import './buttons.css';

export function Button({ text, onClick, type = "primary", style = {} }) {
    //Button component, design for handling all the page design that require the regular button use (the rectangular button)
    //Text: the text displayed on the button;
    //onClick: the function that will be called when clicking
    //type: the type of the buttton, default is primary. Check the detail for more type in css.
    //style: the quick setting of the style when other style setting need.
  return (
    <button className={`btn ${type}`} style = {style} onClick={onClick}>
      {text}
    </button>
  );
}

export function CircleButton({ icon, onClick, style = {}}) {
    //Button component, design for handling all the page design that require the circular button use (the circule button)
    //icon: the icon displayed on the button;
    //onClick: the function that will be called when clicking
    //style: the quick setting of the style when other style setting need.
  return (
    <button className="circle-button" style = {style} onClick={onClick}>
      {icon}
    </button>
  );
}
