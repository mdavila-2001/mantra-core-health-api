FROM prom/alertmanager:v0.28.1
COPY alertmanager.yml.tmpl telegram.tmpl entrypoint.sh /etc/alertmanager/
ENTRYPOINT ["/bin/sh", "/etc/alertmanager/entrypoint.sh"]
