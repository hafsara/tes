import json
import os
import redis


class Connector:
    """
    Classe générique pour envoyer des événements à différents services (Redis, Kafka, etc.).
    """

    def __init__(self, config):
        self.config = config
        self.redis_client = None
        self._init_redis()

    def _init_redis(self):
        """Initialise Redis si configuré."""
        redis_config = self.config.get("redis")
        if redis and redis_config:
            try:
                self.redis_client = redis.StrictRedis(
                    host=redis_config.get("host", "localhost"),
                    port=redis_config.get("port", 6379),
                    db=redis_config.get("db", 0),
                    decode_responses=True
                )
            except Exception as e:
                self.redis_client = None

    def send_event(self, topic_or_channel, event_data):
        """
        Envoie un événement à un service spécifique (Redis, Kafka, etc.).
        :param topic_or_channel: Nom du canal Redis ou du topic Kafka
        :param event_data: Données de l'événement (dict)
        """
        event_json = json.dumps(event_data)

        # Envoyer à Redis
        if self.redis_client:
            try:
                self.redis_client.publish(topic_or_channel, event_json)
                print(f"Événement envoyé à Redis ({topic_or_channel}) : {event_json}")
            except Exception as e:
                print(f"Erreur lors de l'envoi à Redis : {e}")

        if not self.redis_client:
            print(f" Aucun connecteur actif, événement non envoyé : {event_json}")


# Initialisation globale des connecteurs avec la configuration
CONNECTOR_CONFIG = {
    "redis": {
        "host": "localhost",
        "port": 6379,
        "db": 0
    },
    "kafka": {
        "bootstrap_servers": "localhost:9092"
    }
}
connector = Connector(CONNECTOR_CONFIG)
