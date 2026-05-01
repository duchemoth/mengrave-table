import { useState } from "react";
import type { UserMode } from "../types/campaign";

const DEVELOPER_PASSWORD = "550034";

export function useInterfaceMode() {
  const [userMode, setUserMode] = useState<UserMode>("master");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(false);
  const [isCleanMapMode, setIsCleanMapMode] = useState(false);

  const isPlayerMode = userMode === "player";
  const isDeveloperMode = userMode === "developer";

  function changeMode(nextMode: UserMode) {
    if (nextMode === "developer" && userMode !== "developer") {
      const password = window.prompt("Введите пароль Эха");

      if (password !== DEVELOPER_PASSWORD) {
        window.alert("Неверный пароль");
        return;
      }
    }

    setUserMode(nextMode);
    setIsSidebarOpen(true);
    setIsCleanMapMode(false);
  }

  function toggleSidebar() {
    setIsSidebarOpen((current) => !current);
  }

  function toggleBottomDrawer() {
  setIsBottomDrawerOpen((current) => !current);
}

  function openSidebar() {
    setIsSidebarOpen(true);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  function enableCleanMapMode() {
    setIsCleanMapMode(true);
    setIsSidebarOpen(false);
  }

  function exitCleanMapMode() {
    setIsCleanMapMode(false);
  }

  function restoreInterface() {
    setIsCleanMapMode(false);
    setIsSidebarOpen(true);
  }

  return {
    userMode,
    isPlayerMode,
    isDeveloperMode,
    isSidebarOpen,
    isCleanMapMode,
    isBottomDrawerOpen,
    toggleBottomDrawer,

    changeMode,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    enableCleanMapMode,
    exitCleanMapMode,
    restoreInterface,
  };
}