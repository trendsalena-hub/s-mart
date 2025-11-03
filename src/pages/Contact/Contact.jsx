import React from "react";
import "./Contact.scss";

const Contact = () => {
  return (
    <div className="contact-container">
      <h1>Contact</h1>
      <form className="contact-form">
        <div className="form-row">
          <input type="text" placeholder="Name" required />
          <input type="email" placeholder="Email *" required />
        </div>
        <input type="tel" placeholder="Phone number" />
        <textarea placeholder="Comment" rows="5"></textarea>
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Contact;
