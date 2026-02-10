import React from "react";
import { Button } from "../atoms/Button";

interface LogoutButtonProps {
  onLogout: () => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout }) => {
  return (
    <form>
      <Button type="button" variant="danger" onClick={onLogout}>
        Logout
      </Button>
    </form>
  );
};
