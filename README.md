# Semantic-Bus
semantic data transformation &amp; semantic container crawling

## features

- transform data between heterogenous ontologies
  - multiple source protocole
  - multiple destination protocole
  - API creation
  - data transformation without coding
  - value correspondence (translation between taxonomy)
  - data completion from linked field (semantic web) (V2)
  - join data by field
  - data agregation from multiple source
  - geo data completion from address
  - middle cache database for performance
  - support new record mention to propagate information across multiple neighbour node (see web mention) (V2)

- crawl data between semantic nodes
  - index neighbour node data (id and essential field) for the same ontology to perform search (see linked data fragments) (V2)


## install

- `ssh-keygen -t rsa`
- ajouter la clef publique généré (.ssh/id_rsa.pub) dans l'admin de github

### option 1

- `git clone --recursive git@github.com:assemblee-virtuelle/Semantic-Bus.git`

### option 2

- `git clone git@github.com:assemblee-virtuelle/Semantic-Bus.git`
- `git submodule init`
- `git submodule update`

### suite

- `sudo apt-get install g++ build-essential`
- `curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash`
- redemarer console
- `nvm install 7.10`
- `npm install`
