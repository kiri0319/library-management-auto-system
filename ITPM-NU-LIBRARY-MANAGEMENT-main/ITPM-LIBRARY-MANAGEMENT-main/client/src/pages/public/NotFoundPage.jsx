import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="app-shell">
    <div className="panel-card text-center">
      <h1 className="font-display text-5xl">404</h1>
      <p className="mt-3 text-sm text-slate-500">The page you requested is not in this catalog.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to library
      </Link>
    </div>
  </div>
);

export default NotFoundPage;

