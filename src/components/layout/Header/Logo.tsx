"use client";
import React, { useEffect, useState } from "react";

import Link from "next/link";

import LogoKleros from "@/assets/svg/built-by-kleros.svg";
import LogoForeSight from "@/assets/svg/logo-foresight.svg";

const Logo: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-7">
        <Link href={"/"}>
          <LogoForeSight className="hover:brightness-105" />
        </Link>
        <Link href={"https://kleros.io/"}>
          <LogoKleros className="hover:brightness-105" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-7">
      <Link href={"/"}>
        <LogoForeSight className="hover:brightness-105" />
      </Link>
      <Link href={"https://kleros.io/"}>
        <LogoKleros className="hover:brightness-105" />
      </Link>
    </div>
  );
};

export default Logo;
