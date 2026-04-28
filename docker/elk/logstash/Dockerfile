FROM docker.elastic.co/logstash/logstash-wolfi:9.2.2

USER root

# RUN /usr/share/logstash/bin/logstash-plugin install logstash-input-journald

COPY ./tools/init.sh /usr/share/logstash/bin/init.sh
RUN chmod +x /usr/share/logstash/bin/init.sh

USER logstash

EXPOSE 9600
