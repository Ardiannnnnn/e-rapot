import Link from "next/link";
import React from "react";

interface ButtonProps {
  title: string;
  href?: string;
  classname?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export default function ButtonHijau({
  title,
  href,
  classname = "",
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  if (onClick || type === "submit") {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`bg-[#1b4332] hover:bg-[#143225] disabled:opacity-50 text-white ${classname}`}
      >
        {title}
      </button>
    );
  }

  return (
    <Link
      href={href || "#"}
      className={`bg-[#1b4332] hover:bg-[#143225] text-white ${classname}`}
    >
      {title}
    </Link>
  );
}

export function ButtonTrans({
  title,
  href,
  classname = "",
  onClick,
  type = "button",
}: ButtonProps) {
  if (onClick) {
    return (
      <button
        type={type}
        onClick={onClick}
        className={`bg-white border border-stone-200 hover:bg-stone-50 ${classname}`}
      >
        {title}
      </button>
    );
  }

  return (
    <Link
      href={href || "#"}
      className={`bg-white border border-stone-200 hover:bg-stone-50 ${classname}`}
    >
      {title}
    </Link>
  );
}

export function ButtonAmber({
  title,
  href,
  classname = "",
  onClick,
  type = "button",
}: ButtonProps) {
  if (onClick) {
    return (
      <button
        type={type}
        onClick={onClick}
        className={`bg-amber-500 hover:bg-amber-600 text-white ${classname}`}
      >
        {title}
      </button>
    );
  }

  return (
    <Link
      href={href || "#"}
      className={`bg-amber-500 hover:bg-amber-600 text-white ${classname}`}
    >
      {title}
    </Link>
  );
}
