import type { ReactNode } from "react";

type Props = {
  title: string;
  message?: string;
  actions?: ReactNode;
};

export function StatePanel({ title, message, actions }: Props) {
  return (
    <div className="state-panel" role="status">
      <h2>{title}</h2>
      {message ? <p>{message}</p> : null}
      {actions}
    </div>
  );
}
