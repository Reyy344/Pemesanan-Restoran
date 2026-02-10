import React from "react";
import { Button } from "../atoms/Button";

interface AuthFormProps {
  title: string;
  buttonText: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  title,
  buttonText,
  onSubmit,
  children,
}) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-md w-[350px]">
      <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>
      <form onSubmit={onSubmit}>
        {children}
        <Button type="submit" className="w-full mt-4">
          {buttonText}
        </Button>
      </form>
    </div>
  );
};
