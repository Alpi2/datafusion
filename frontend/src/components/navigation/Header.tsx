"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Search,
  TrendingUp,
  Wallet,
  User,
  Menu,
  X,
  BarChart3,
  Coins,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const navItems = [
  { name: "Generate", href: "/", icon: Brain },
  { name: "Business Intel", href: "/intelligence", icon: BarChart3 },
  { name: "Tokenisation", href: "/auto-price-engine", icon: Coins },
  { name: "Marketplace", href: "/marketplace", icon: Search },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Dashboard", href: "/dashboard", icon: User },
  { name: "Wallet", href: "/wallet", icon: Wallet },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      type: "graduation",
      message: "Your E-commerce Dataset graduated to Uniswap!",
      time: "5 min ago",
      unread: true,
    },
    {
      id: 2,
      type: "milestone",
      message: "Healthcare Dataset reached 100 holders",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      type: "earning",
      message: "You earned 1,250 $INAI from trading fees",
      time: "3 hours ago",
      unread: false,
    },
  ]);
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
              DataFusion
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                  {item.name === "Marketplace" && (
                    <Badge
                      variant="secondary"
                      className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-xs"
                    >
                      1.2K
                    </Badge>
                  )}
                  {item.name === "Tokenisation" && (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-xs"
                    >
                      NEW
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-slate-300">
                <span className="font-medium text-white">2,450</span> $INAI
              </span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-4 z-50">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Notifications
                  </h3>
                  <div className="space-y-2">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-lg hover:bg-slate-700/50 transition-colors ${
                          notif.unread ? "bg-slate-700/30" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              notif.type === "graduation"
                                ? "bg-emerald-400"
                                : notif.type === "milestone"
                                ? "bg-purple-400"
                                : "bg-blue-400"
                            }`}
                          />
                          <div className="flex-1">
                            <p className="text-sm text-white">
                              {notif.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {notif.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-3" size="sm">
                    View All Notifications
                  </Button>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 hover:border-slate-600"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>

            <Link href="/auth">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                Connect Wallet
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800/50 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200
                      ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                    {item.name === "Marketplace" && (
                      <Badge
                        variant="secondary"
                        className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-xs ml-auto"
                      >
                        1.2K
                      </Badge>
                    )}
                    {item.name === "Tokenisation" && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-xs ml-auto"
                      >
                        NEW
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm text-slate-300">
                  <span className="font-medium text-white">2,450</span> $INAI
                </span>
              </div>

              <div className="flex gap-2 px-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-slate-700 hover:border-slate-600"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>

                <Button
                  size="sm"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  Connect Wallet
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
