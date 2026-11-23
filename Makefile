NAME = music-room

all: start

start:
	docker compose -f docker-compose.yml up --build -d

stop:
	docker compose -f docker-compose.yml stop

clean:
	docker compose -f docker-compose.yml down -v --remove-orphans

re: clean start

install:
	npm install

logs:
	docker compose -f docker-compose.yml logs -f

mobile:
	cd mobile && npm run start

.PHONY: all start stop clean re install logs mobile
