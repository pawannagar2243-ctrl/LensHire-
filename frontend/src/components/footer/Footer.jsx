import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-dark text-light pt-5 pb-3 mt-auto">
    <div className="container">
      <div className="row g-4">
        <div className="col-md-4">
          <h5 className="fw-bold">
            <i className="bi bi-camera2 text-warning me-2" />
            LensHire
          </h5>
          <p className="text-secondary small">
            Professional camera and gear rental for photographers, filmmakers, and creators.
          </p>
        </div>
        <div className="col-6 col-md-2">
          <h6 className="text-warning">Explore</h6>
          <ul className="list-unstyled small">
            <li><Link className="text-secondary text-decoration-none" to="/cameras">Cameras</Link></li>
            <li><Link className="text-secondary text-decoration-none" to="/categories">Categories</Link></li>
            <li><Link className="text-secondary text-decoration-none" to="/search">Search</Link></li>
          </ul>
        </div>
        <div className="col-6 col-md-2">
          <h6 className="text-warning">Company</h6>
          <ul className="list-unstyled small">
            <li><Link className="text-secondary text-decoration-none" to="/about">About</Link></li>
            <li><Link className="text-secondary text-decoration-none" to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div className="col-md-4">
          <h6 className="text-warning">Contact</h6>
          <p className="small text-secondary mb-1">
            <i className="bi bi-envelope me-2" />
            pawannagar2243@gmail.com
          </p>
          <p className="small text-secondary mb-0">
            <i className="bi bi-telephone me-2" />
            +91 8239537689
          </p>
        </div>
      </div>
      <hr className="border-secondary my-4" />
      <p className="text-center text-secondary small mb-0">
        © {new Date().getFullYear()} LensHire. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
