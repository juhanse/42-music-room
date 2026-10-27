NAME = music-room
DOCKER_COMPOSE = docker compose -f docker-compose.yml

all: start

start:
	$(DOCKER_COMPOSE) up --build -d

stop:
	$(DOCKER_COMPOSE) stop

clean: stop
	$(DOCKER_COMPOSE) down -v --remove-orphans

fclean: clean
	docker system prune -af --volumes

re: clean start

.PHONY: all start stop clean fclean re
