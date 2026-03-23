"use client";

import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MagicWandIcon } from "@radix-ui/react-icons";
import { cn } from "@repo/lib/utils";
import { useState, useEffect} from "react";
import { Button } from "./ui/button";

interface AppbarProps {
  user?: any;
  onSignin: () => void;
  onSignout: () => void;
}

export default function Navbar({
    user,
    onSignin,
    onSignout
}: AppbarProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
        let lastScrollY = window.scrollY;
        const controlNavbar = () =>{
            const currentScrollY = window.scrollY;
            if(currentScrollY>lastScrollY&&currentScrollY>100   ){
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            lastScrollY = currentScrollY;
        }
        window.addEventListener("scroll", controlNavbar);
        return () => window.removeEventListener("scroll", controlNavbar);
    }, []);
  return (
    <nav
      className={
        `w-full bg-gradient-to-r from-[#fbe5f8] to-[#f6d4fa] shadow-md backdrop-blur-sm sticky top-0 z-50 transition-opacity duration-700 z-50
        ${isVisible ? "translate-y-0" : "-translate-y-full"}`}>

      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <MagicWandIcon className="w-6 h-6 text-pink-600" />
          <Link href="/" className="text-xl font-bold text-gray-900">
            GESTURE<span className="text-pink-600">LOVE</span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <NavigationMenu.Root>
          <NavigationMenu.List className="flex space-x-8 text-gray-700 font-medium">
            <NavigationMenu.Item>
              <Link
                href="/"
                className={cn(
                  "transition-colors hover:text-pink-600",
                  pathname === "/" && "text-pink-600"
                )}
              >
                Home
              </Link>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <Link
                href="/control"
                className={cn(
                  "transition-colors hover:text-pink-600",
                  pathname === "/control" && "text-pink-600 font-semibold"
                )}
              >
                Control
              </Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>
        <div className="flex flex-col justify-center pt-2">
            <Button
                className="bg-pink-600 text-white px-4 py-2 rounded-xl hover:bg-pink-700 transition-all shadow-sm"
                onClick={user ? onSignout : onSignin}>{user ? "Logout" : "Login"}
            </Button>
        </div>
      </div>
    </nav>
  );
}
