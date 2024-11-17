FROM python:3.12
RUN useradd -ms /bin/sh -u 1001 app
USER app

WORKDIR /app
COPY --chown=app:app requirements.txt ./

RUN pip install -r requirements.txt

COPY --chown=app:app . /app