# Imagem base do Node
FROM node:18

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN yarn install

# Copia o restante do código da aplicação
COPY . .

# Expõe a porta que o Express vai usar
EXPOSE 3000

# Comando padrão para iniciar o servidor
CMD ["yarn", "dev"]
