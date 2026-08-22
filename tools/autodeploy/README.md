# Auto-despliegue de la API

La API y sus 23 workers comparten la imagen `mantra-redesa-api:local`. Esto la reconstruye cuando
`origin/dev` avanza y recrea los 24 servicios, sin tocar tu copia de trabajo: cada pasada
construye desde un `git worktree` desprendido en el commit remoto, y lo borra al terminar.

```
tools/autodeploy/autodeploy.sh systemd    # instalarlo (una vez)
tools/autodeploy/autodeploy.sh estado     # qué commit sirve
tools/autodeploy/autodeploy.sh logs 60    # el diario
tools/autodeploy/autodeploy.sh parar      # desactivar el temporizador
```

## Lo que hay que saber

- **Se despliega en dos tiempos.** Primero la API sola; los workers sólo si contesta sana. Si no
  levanta, se vuelve a la imagen anterior por su id y los workers ni se enteran.
- **Siempre `--no-deps`.** El compose declara `postgres-init` con
  `condition: service_completed_successfully` y en esta máquina esa inicialización no termina;
  sin `--no-deps` cada despliegue esperaría a un trabajo que no acaba.
- **Vigila `origin/dev`, no tu `HEAD`.** Como Render: lo que no está pusheado no se despliega.
- **Corre con `linger`**, así que sobrevive a los reinicios sin que nadie inicie sesión.
- Conserva las tres últimas imágenes por si hay que volver a mano a una de ayer.
