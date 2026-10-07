# Nunca armazenar dados de cartão

Quando os pagamentos chegarem (cartão e Pix, v2), os dados do cartão são digitados num componente do provedor de pagamento e nunca passam pelos nossos servidores; guardamos apenas o token do provedor, a bandeira, os quatro últimos dígitos e o status. Armazenar número, validade ou CVV obrigaria a cumprir o PCI DSS, o que está fora de questão para este projeto.
