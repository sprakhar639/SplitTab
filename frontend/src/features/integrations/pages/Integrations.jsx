import { useEffect, useState } from "react";

import { useAuth } from "../../../context/AuthContext";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import Loader from "../../../shared/components/Loader";
import Modal from "../../../shared/components/Modal";
import IntegrationCard from "../components/IntegrationCard";
import {
  INTEGRATIONS,
  connectIntegration,
  disconnectIntegration,
  getConnections,
  sendTestMessage,
} from "../integration.service";

export default function Integrations() {
  const { user } = useAuth();

  const [connections, setConnections] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [target, setTarget] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getConnections(user?.email).then(setConnections);
  }, [user?.email]);

  async function refresh() {
    setConnections(await getConnections(user?.email));
  }

  function openConnect(integration) {
    setConnecting(integration);
    setTarget("");
    setFieldError("");
  }

  async function handleConnect(e) {
    e.preventDefault();

    if (!connecting.field.pattern.test(target.trim())) {
      setFieldError(connecting.field.error);
      return;
    }

    setBusy({ [connecting.id]: "connect" });
    await connectIntegration(connecting.id, target);
    await refresh();
    setNotice(`${connecting.name} connected. You can now pick it when you set up a reminder.`);
    setConnecting(null);
    setBusy({});
  }

  async function handleDisconnect(integration) {
    setBusy({ [integration.id]: "disconnect" });
    await disconnectIntegration(integration.id);
    await refresh();
    setNotice(`${integration.name} disconnected. Reminders using it fall back to email.`);
    setBusy({});
  }

  async function handleTest(integration) {
    setBusy({ [integration.id]: "test" });
    await sendTestMessage(integration.id);
    setNotice(`Test message sent to ${integration.name} (${connections[integration.id].target}).`);
    setBusy({});
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Integrations</h1>
        <p className="text-sm text-mute">
          Choose where your reminders and spending reports are sent.
        </p>
      </div>

      {notice && (
        <p role="status" className="rounded-lg bg-mint/30 px-3 py-2 text-sm font-semibold text-success">
          ✓ {notice}
        </p>
      )}

      {!connections ? (
        <Loader label="Loading integrations…" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              connection={connections[integration.id]}
              busy={busy[integration.id]}
              onConnect={() => openConnect(integration)}
              onDisconnect={() => handleDisconnect(integration)}
              onTest={() => handleTest(integration)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-mute">
        Connections are mocked and stored in this browser. Nothing is sent yet;
        the backend will handle verification and delivery.
      </p>

      <Modal
        open={Boolean(connecting)}
        title={`Connect ${connecting?.name ?? ""}`}
        onClose={() => setConnecting(null)}
      >
        {connecting && (
          <form onSubmit={handleConnect} className="flex flex-col gap-4" noValidate>
            <Input
              id="integration-target"
              label={connecting.field.label}
              placeholder={connecting.field.placeholder}
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setFieldError("");
              }}
              error={fieldError}
              hint={connecting.note}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConnecting(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={busy[connecting.id] === "connect"}>
                Connect
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
