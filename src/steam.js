function fetchSteamDataForSingleGame(game, callback) {
  if (!game || typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    if (callback) callback(null);
    return;
  }

  chrome.runtime.sendMessage(
    { action: 'GET_STEAM_DATA', title: game.title, rawTitle: game.rawTitle },
    (response) => {
      if (response && response.success && response.data) {
        game.steamData = response.data;
        if (callback) callback(response.data);
      } else {
        if (callback) callback(null);
      }
    }
  );
}
