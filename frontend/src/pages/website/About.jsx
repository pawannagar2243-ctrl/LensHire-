const About = () => (
  <div className="container py-5">
    <div className="row align-items-center g-5 mb-5">
      <div className="col-lg-6">
        <h1 className="display-6 fw-bold mb-3">About LensHire</h1>
        <p className="lead text-muted">
          We help photographers and filmmakers access professional cameras without buying everything upfront.
        </p>
        <p>
          LensHire started with a simple idea: great stories deserve great gear. Our inventory covers
          DSLRs, mirrorless bodies, cinema cameras, lenses, and accessories — maintained and ready to rent.
        </p>
        <p className="mb-0">
          Whether you are shooting a wedding, a short film, or a weekend adventure, book the tools you need
          and focus on creating.
        </p>
      </div>
      <div className="col-lg-6">
        <img
          src="https://booking-website-wgg0.onrender.com/unsplash-image-l7i83goh.jpg"
          alt="Photography studio"
          className="img-fluid rounded shadow"
        />
      </div>
    </div>
    <div className="row g-4 text-center">
      {[
        { n: '500+', l: 'Happy Renters' },
        { n: '100+', l: 'Cameras & Lenses' },
        { n: '50+', l: 'Cities Served' },
        { n: '4.8', l: 'Average Rating' },
      ].map((s) => (
        <div className="col-6 col-md-3" key={s.l}>
          <div className="p-3 bg-light rounded">
            <div className="h2 fw-bold text-warning mb-0">{s.n}</div>
            <div className="text-muted small">{s.l}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default About;
