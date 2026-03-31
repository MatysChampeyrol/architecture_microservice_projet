import os
import json
import time
import psutil
import numpy as np
from kafka import KafkaProducer

LIBRARY = os.environ.get("LIBRARY", "pytorch")
DATASET = os.environ.get("DATASET", "fashion-mnist")
KAFKA_BROKER = os.environ.get("KAFKA_BROKER", "kafka:9092")
EPOCHS = 5

producer = KafkaProducer(
    bootstrap_servers=KAFKA_BROKER,
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)


def send_metric(library, dataset, epoch, accuracy, loss, cpu, ram, execution_time):
    producer.send("training_metrics", {
        "library": library,
        "dataset": dataset,
        "epoch": epoch,
        "accuracy": round(float(accuracy), 4),
        "loss": round(float(loss), 4),
        "cpu": round(float(cpu), 2),
        "ram": round(float(ram), 2),
        "execution_time": round(float(execution_time), 2)
    })
    producer.flush()


if LIBRARY == "pytorch":
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torchvision import datasets, transforms
    from torch.utils.data import DataLoader

    if DATASET == "cifar100":
        transform = transforms.Compose([transforms.ToTensor()])
        train_data = datasets.CIFAR100(root="./data", train=True, download=True, transform=transform)
        in_channels = 3
        flat_size = 64 * 8 * 8
        num_classes = 100
    else:
        transform = transforms.Compose([transforms.ToTensor()])
        train_data = datasets.FashionMNIST(root="./data", train=True, download=True, transform=transform)
        in_channels = 1
        flat_size = 64 * 7 * 7
        num_classes = 10

    loader = DataLoader(train_data, batch_size=64, shuffle=True)

    model = nn.Sequential(
        nn.Conv2d(in_channels, 32, 3, padding=1), nn.ReLU(),
        nn.MaxPool2d(2),
        nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(),
        nn.MaxPool2d(2),
        nn.Flatten(),
        nn.Linear(flat_size, 128), nn.ReLU(),
        nn.Linear(128, num_classes)
    )

    optimizer = optim.Adam(model.parameters())
    criterion = nn.CrossEntropyLoss()

    for epoch in range(1, EPOCHS + 1):
        start_time = time.time()
        total_loss = 0.0
        correct = 0
        total = 0
        for images, labels in loader:
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * labels.size(0)
            correct += (outputs.argmax(1) == labels).sum().item()
            total += labels.size(0)

        epoch_loss = total_loss / total
        epoch_acc = correct / total
        epoch_time = time.time() - start_time
        cpu = psutil.cpu_percent(interval=0.1)
        ram = psutil.virtual_memory().percent
        send_metric("pytorch", DATASET, epoch, epoch_acc, epoch_loss, cpu, ram, epoch_time)

else:
    import tensorflow as tf

    if DATASET == "cifar100":
        (x_train, y_train), _ = tf.keras.datasets.cifar100.load_data()
        x_train = x_train.astype("float32") / 255.0
        input_shape = (32, 32, 3)
        num_classes = 100
    else:
        (x_train, y_train), _ = tf.keras.datasets.fashion_mnist.load_data()
        x_train = x_train.astype("float32") / 255.0
        x_train = x_train[..., np.newaxis]
        input_shape = (28, 28, 1)
        num_classes = 10

    model = tf.keras.Sequential([
        tf.keras.layers.Conv2D(32, 3, activation="relu", padding="same", input_shape=input_shape),
        tf.keras.layers.MaxPooling2D(),
        tf.keras.layers.Conv2D(64, 3, activation="relu", padding="same"),
        tf.keras.layers.MaxPooling2D(),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.Dense(num_classes, activation="softmax")
    ])

    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])

    for epoch in range(1, EPOCHS + 1):
        start_time = time.time()
        history = model.fit(x_train, y_train, epochs=1, batch_size=64, verbose=0)
        epoch_time = time.time() - start_time
        epoch_loss = history.history["loss"][0]
        epoch_acc = history.history["accuracy"][0]
        cpu = psutil.cpu_percent(interval=0.1)
        ram = psutil.virtual_memory().percent
        send_metric("keras", DATASET, epoch, epoch_acc, epoch_loss, cpu, ram, epoch_time)
