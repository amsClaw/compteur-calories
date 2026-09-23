#!/bin/bash
# Double-clic : démarre un petit serveur local pour l'appli « Mes calories » et ouvre le navigateur.
cd "$(dirname "$0")" || exit 1
PORT=8791

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Le serveur tourne déjà sur le port $PORT."
else
  echo "Démarrage du serveur local sur le port $PORT…"
  (python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/mes-calories-serveur.log 2>&1 &)
  sleep 1
fi

open "http://127.0.0.1:$PORT/app/index.html"
echo ""
echo "Appli ouverte dans le navigateur : http://127.0.0.1:$PORT/app/index.html"
echo "Guide : http://127.0.0.1:$PORT/docs/GUIDE_UTILISATEUR.html"
echo ""
echo "Pour arrêter le serveur plus tard :  lsof -ti tcp:$PORT | xargs kill"
echo "Tu peux fermer cette fenêtre."
