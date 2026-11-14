import Button from "../../../shared/components/Button";
import formatDate from "../../../shared/utils/formatDate";

export default function IntegrationCard({ integration, connection, busy, onConnect, onDisconnect, onTest }) {
  const connected = Boolean(connection);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
      <div className="flex items-start gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold text-deep ${integration.color}`}
          aria-hidden="true"
        >
          {integration.badge}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-extrabold">{integration.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                connected ? "bg-mint/30 text-success" : "bg-canvas text-mute"
              }`}
            >
              {connected ? "Connected" : "Not connected"}
            </span>
          </div>
          <p className="text-sm text-mute">{integration.description}</p>
        </div>
      </div>

      {connected && (
        <p className="truncate rounded-lg bg-canvas px-3 py-2 text-xs text-mute">
          Sending to <span className="font-semibold text-ink">{connection.target}</span>
          {connection.connectedAt && ` · since ${formatDate(connection.connectedAt)}`}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        {connected ? (
          <>
            <Button variant="ghost" loading={busy === "test"} onClick={onTest}>
              Send test
            </Button>
            {!integration.builtIn && (
              <Button variant="danger" loading={busy === "disconnect"} onClick={onDisconnect}>
                Disconnect
              </Button>
            )}
          </>
        ) : (
          <Button onClick={onConnect}>Connect</Button>
        )}
      </div>
    </div>
  );
}
