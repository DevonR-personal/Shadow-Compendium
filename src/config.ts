const path = window.location.pathname

export const APP_MODE =
    path === "/player"
        ? "player"
        : "gm"