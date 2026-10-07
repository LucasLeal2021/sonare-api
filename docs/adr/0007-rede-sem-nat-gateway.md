# Rede sem NAT Gateway e sem SSH

As EC2 ficam em sub-redes públicas, com security groups que só abrem o estritamente necessário (web recebe HTTP; API recebe apenas do SG da web; worker não recebe nada), e os bancos ficam em sub-redes privadas liberados só para o SG da API. Evitamos o padrão "sub-rede privada + NAT Gateway" porque o NAT custa dezenas de dólares por mês na AWS real mesmo parado, e as máquinas não precisam receber conexões da internet. O acesso operacional às instâncias é feito por SSM Run Command, sem porta 22 aberta.
