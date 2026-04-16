import { Link } from "react-router-dom";

const UnauthorizedPage = () => (
  <div className="app-shell">
    <div className="panel-card text-center">
      <h1 className="font-display text-4xl">Unauthorized</h1>
      <p className="mt-3 text-sm text-slate-500">You do not have permission to open this workspace.</p>
      <Link to="/" className="btn-primary mt-6">
        Return Home
      </Link>
    </div>
  </div>
);

export default UnauthorizedPage;

