function fetchSteamDataForSingleGame(game, callback) {
  if (!game) {
    if (callback) callback(null);
    return;
  }

  safeSendMessage(
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
