import threading
import json
import os
from collections import defaultdict
from fastapi import APIRouter, Depends
from kafka import KafkaConsumer
from supabase import create_client
from auth_service.auth_service import get_current_user, require_admin
from config.config import get_settings

router = APIRouter(prefix="/training", tags=["Training"])

KAFKA_BROKER = os.environ.get("KAFKA_BROKER", "kafka:9092")
EPOCHS = 5

metrics = []


def kafka_consumer_thread():
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    consumer = KafkaConsumer(
        "training_metrics",
        bootstrap_servers=KAFKA_BROKER,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="earliest",
        group_id="computation-service"
    )
    for message in consumer:
        data = message.value
        metrics.append(data)
        supabase.table("training_metrics").insert(data).execute()


def start_consumer():
    t = threading.Thread(target=kafka_consumer_thread, daemon=True)
    t.start()


def group_metrics_by_model(raw):
    grouped = defaultdict(list)
    for m in raw:
        grouped[(m["library"], m["dataset"])].append(m)
    result = []
    for (library, dataset), entries in grouped.items():
        result.append({
            "library": library,
            "dataset": dataset,
            "metrics": [
                {
                    "epoch": e["epoch"],
                    "accuracy": e["accuracy"],
                    "loss": e["loss"],
                    "execution_time": e.get("execution_time", 0)
                }
                for e in entries
            ]
        })
    return result


@router.get("/metrics", dependencies=[Depends(get_current_user)])
def get_metrics():
    return group_metrics_by_model(metrics)


@router.get("/metrics/summary", dependencies=[Depends(get_current_user)])
def get_metrics_summary():
    grouped = defaultdict(list)
    for m in metrics:
        grouped[(m["library"], m["dataset"])].append(m)
    result = []
    for (library, dataset), entries in grouped.items():
        last = entries[-1]
        result.append({
            "name": f"{library} / {dataset}",
            "epochs_completed": len(entries),
            "accuracy": last["accuracy"],
            "loss": last["loss"],
            "execution_time": last.get("execution_time", 0),
            "cpu": last.get("cpu", 0),
            "ram": last.get("ram", 0),
            "status": "terminé" if len(entries) >= EPOCHS else "en cours"
        })
    return result


@router.get("/metrics/system", dependencies=[Depends(require_admin)])
def get_system_metrics():
    grouped = defaultdict(list)
    for m in metrics:
        grouped[(m["library"], m["dataset"])].append(m)
    result = []
    for (library, dataset), entries in grouped.items():
        result.append({
            "library": library,
            "dataset": dataset,
            "metrics": [
                {
                    "epoch": e["epoch"],
                    "cpu": e.get("cpu", 0),
                    "ram": e.get("ram", 0)
                }
                for e in entries
            ]
        })
    return result
