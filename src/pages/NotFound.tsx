
import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="container">
      <div className="welcome-card">
        <h1>Página no encontrada</h1>
        <p>La página que está buscando no existe.</p>
        <div className="button-container">
          <Link to="/" className="btn primary-btn">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
