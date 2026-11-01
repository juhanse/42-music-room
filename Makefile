NAME = music-room

all: start

start:
	docker compose -f docker-compose.yml up --build -d
	@mkdir -p mobile
	@touch mobile/expo.log
	@cd mobile && nohup npx expo start > expo.log 2>&1 &
	@echo "Services démarrés en arrière-plan. Utilisez 'make logs' pour afficher l'activité."

stop:
	docker compose -f docker-compose.yml stop
	@-pkill -f "expo start" || true

clean:
	docker compose -f docker-compose.yml down -v --remove-orphans
	@-pkill -f "expo start" || true
	@rm -f mobile/expo.log

re: clean start

logs:
	@tail -f mobile/expo.log & docker compose -f docker-compose.yml logs -f

.PHONY: all start stop clean re logs
