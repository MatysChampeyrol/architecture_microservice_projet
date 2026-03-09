import threading
import json
import os
from fastapi import APIRouter, Depends
from kafka import KafkaConsumer
from auth_service.auth_service import get_current_user, require_admin

router = APIRouter(prefix="/metrics", tags=["Metrics"])

KAFKA_BROKER = os.environ.get("KAFKA_BROKER", "kafka:9092")

metrics = []

def kafka_consumer_thread():
    consumer = KafkaConsumer(
        "training_metrics",
        bootstrap_servers=KAFKA_BROKER,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="earliest",
        group_id="computation-service"
    )
    for message in consumer:
        metrics.append(message.value)

def start_consumer():
    t = threading.Thread(target=kafka_consumer_thread, daemon=True)
    t.start()

@router.get("", dependencies=[Depends(get_current_user)])
def get_metrics():
    return [
        {
            "library": m["library"],
            "dataset": m["dataset"],
            "epoch": m["epoch"],
            "accuracy": m["accuracy"],
            "loss": m["loss"]
        }
        for m in metrics
    ]

@router.get("/system", dependencies=[Depends(require_admin)])
def get_system_metrics():
    return [
        {
            "library": m["library"],
            "dataset": m["dataset"],
            "epoch": m["epoch"],
            "cpu": m["cpu"],
            "ram": m["ram"]
        }
        for m in metrics
    ]
