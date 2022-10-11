import clsx from "clsx";
import React from "react";
import { BsFillLightningChargeFill } from "react-icons/bs";
import { SiTwitter } from "react-icons/si";

type ButtonProps = {
  callback: () => Promise<void>;
  icon: string;
  children?: React.ReactNode;
  isSignOut?: boolean;
};

const StyledButton = ({
  callback,
  icon,
  isSignOut = false,
  children,
}: ButtonProps) => {
  const ButtonIcon = () => {
    switch (icon) {
      case "twitter":
        return <SiTwitter />;
      case "convert":
        return <BsFillLightningChargeFill />;
      default:
        break;
    }
  };
  return (
    <a
      onClick={callback}
      className="group relative inline-flex animate-pulse cursor-pointer items-center justify-center overflow-hidden rounded-full px-6 py-3 font-bold text-white shadow-2xl"
    >
      <span className="absolute inset-0 h-full w-full bg-gradient-to-br from-pink-600 via-purple-700 to-blue-400 opacity-0 transition duration-300 ease-out group-hover:opacity-100"></span>
      <span className="absolute top-0 left-0 h-1/3 w-full bg-gradient-to-b from-white to-transparent opacity-5"></span>
      <span className="absolute bottom-0 left-0 h-1/3 w-full bg-gradient-to-t from-white to-transparent opacity-5"></span>
      <span className="absolute bottom-0 left-0 h-full w-4 bg-gradient-to-r from-white to-transparent opacity-5"></span>
      <span className="absolute bottom-0 right-0 h-full w-4 bg-gradient-to-l from-white to-transparent opacity-5"></span>
      <span className="absolute inset-0 h-full w-full rounded-md border border-white opacity-10"></span>
      <span className="absolute h-0 w-0 rounded-full bg-white opacity-5 transition-all duration-300 ease-out group-hover:h-56 group-hover:w-56"></span>

      <div
        className={clsx("inline-flex items-center", {
          "text-red-500 hover:text-white": isSignOut,
        })}
      >
        {ButtonIcon()}
        <span className=" relative pl-4">{children}</span>
      </div>
    </a>
  );
};

export default StyledButton;

// className={clsx(
//   "group relative inline-flex animate-pulse cursor-pointer items-center justify-center overflow-hidden rounded-full px-6 py-3 font-bold text-white shadow-2xl",
//   { "pointer-events-none text-gray-700": isMinting }
// )}
