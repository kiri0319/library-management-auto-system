import { useEffect, useId, useRef } from "react";

const QrScannerPanel = ({ enabled, onScan }) => {
  const containerId = useId().replace(/:/g, "");
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let scanner;

    if (!enabled) {
      return undefined;
    }

    import("html5-qrcode")
      .then(({ Html5QrcodeScanner }) => {
        scanner = new Html5QrcodeScanner(
          containerId,
          { fps: 10, qrbox: { width: 220, height: 220 } },
          false
        );

        scanner.render(
          async (decodedText) => {
            onScanRef.current(decodedText);
            await scanner.clear();
          },
          () => {}
        );
      })
      .catch((error) => console.error(error));

    return () => {
      if (scanner?.clear) {
        scanner.clear().catch(() => {});
      }
    };
  }, [containerId, enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="panel-muted">
      <p className="mb-3 text-sm font-semibold text-slate-700">Scan return QR</p>
      <div id={containerId} />
    </div>
  );
};

export default QrScannerPanel;
