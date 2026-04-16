import { getBadgeClass } from "../../utils/format";

const StatusBadge = ({ value }) => <span className={`status-pill ${getBadgeClass(value)}`}>{value}</span>;

export default StatusBadge;

