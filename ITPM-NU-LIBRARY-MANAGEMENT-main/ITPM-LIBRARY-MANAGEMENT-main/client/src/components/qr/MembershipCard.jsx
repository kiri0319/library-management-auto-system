import { useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";

const MembershipCard = ({ user }) => {
  const reduceMotion = useReducedMotion();
  const qrCanvasRef = useRef(null);
  const qrPayload = useMemo(() => {
    const payload = {
      type: "student_profile",
      membershipCode: user?.membershipCode,
      studentId: user?.studentId,
      name: user?.name,
      email: user?.email,
      role: user?.role,
      status: user?.status,
      phone: user?.phone,
      address: user?.address,
    };

    if (user?.avatar && !String(user.avatar).startsWith("data:") && String(user.avatar).length <= 220) {
      payload.avatar = user.avatar;
    }

    return payload;
  }, [user]);

  const qrValue = useMemo(() => JSON.stringify(qrPayload), [qrPayload]);

  const onDownloadQr = () => {
    const refNode = qrCanvasRef.current;
    const canvas = refNode?.tagName === "CANVAS" ? refNode : refNode?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${user?.membershipCode || "membership"}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={reduceMotion ? false : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduceMotion ? undefined : { scale: 1.005 }}
      className="panel-card overflow-hidden bg-[linear-gradient(135deg,#0b1654_0%,#1d2a88_45%,#2952ff_180%)] text-white shadow-lg shadow-indigo-900/20"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-indigo-200">Digital Membership</p>
          <h3 className="mt-3 font-display text-3xl">{user?.name}</h3>
          <p className="mt-2 text-sm text-slate-200">{user?.email}</p>
          <div className="mt-5 grid gap-2 text-sm text-slate-200">
            <p>Role: {user?.role}</p>
            <p>Member ID: {user?.membershipCode || "N/A"}</p>
            <p>Status: {user?.status}</p>
          </div>
        </div>
        <motion.div
          className="rounded-[1.75rem] bg-white p-4 shadow-inner"
          whileHover={reduceMotion ? undefined : { scale: 1.04 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <QRCodeSVG
            value={qrValue}
            size={180}
            bgColor="#ffffff"
            fgColor="#102a43"
          />
        </motion.div>
      </div>
      <div className="mt-4">
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onDownloadQr}>
          Download QR
        </button>
      </div>
      <QRCodeCanvas
        value={qrValue}
        size={180}
        bgColor="#ffffff"
        fgColor="#102a43"
        className="hidden"
        includeMargin
        level="M"
        ref={qrCanvasRef}
      />
    </motion.div>
  );
};

export default MembershipCard;
