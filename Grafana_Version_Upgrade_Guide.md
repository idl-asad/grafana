# Grafana version upgrade steps

As clientbook is using grafana with some customizations, In order to get syncup with grafana versions following steps can be followed

* Clone code with [Grafana Official Repo](https://github.com/grafana/grafana) 
    ```
    git clone https://github.com/grafana/grafana.git
    ```
* Checkout repo to desired tag
    ```
    git checkout v0.6.7
    ```
* Now change remote url of local repo to our customized grafana repo, Currently it is [here](https://github.com/idl-asad/grafana)
    ```
    git remote set-url origin https://github.com/idl-asad/grafana.git
    ```
* To syncup all commits, tags and branches with newly added remote
    ```
    git fetch --all
    ```
* Checkout to new branch, branch current naming convention is `{tag}-config`
    ```
    git checkout -b v0.6.7-config
    ```
* Now start cherry picking custom commits in down to top order from remote repository previous version branch in our case `v6.2.2-config`
    ```
    git cherry-pick {commit-hash}
    ```
* If any conflicts may occur resolve them thoroughly and continue cherry-picking process after adding the code
    ```
    # After resolving conflicts
    git add .
    git cherry-pick --continue
    ```

* Once all commits are cherry-picked, run grafana locally and validate custom changes

* Now push code to remote
    ```
    git push origin v0.6.7-config
    ```

## Build Docker Image

Usually we maintain two versions of every updated image at [docker hub repository](https://hub.docker.com/r/hassanfarid/cb_frontend), One image tag of build without plugins and other image tag of build with plugins, In order to create docker images following are the steps

* Naming convention on docker hub repo is followed as `hassanfarid/cb_frontend:{grafana_version}-{docker_build_variant_of_same_version}`
* On branch where above steps have been performed in current scenario `v6.7.2-config`, run docker build command:
    ```
    docker build -t hassanfarid/cb_frontend:v6.7.2-1 .
    ```
* Above created build is without plugins, Now inorder to add plugins to current build change base image to `hassanfarid/cb_frontend:v6.7.2-1` in custom docker file provided by grafana under ./packaging/docker/custom/Dockerfile

* Now create another docker image with list of desired grafana plugins
    ```
    docker build -t hassanfarid/cb_frontend:v6.7.2-2 -f ./packaging/docker/custom/Dockerfile --build-arg "GF_INSTALL_PLUGINS=natel-plotly-panel,grafana-polystat-panel,natel-discrete-panel,jdbranham-diagram-panel,natel-influx-admin-panel,grafana-piechart-panel,ryantxu-annolist-panel,ryantxu-ajax-panel,yesoreyeram-boomtable-panel,digiapulssi-breadcrumb-panel,michaeldmoore-multistat-panel,flant-statusmap-panel,vonage-status-panel,zuburqan-parity-report-panel,jeanbaptistewatenberg-percent-panel,petrslavotinek-carpetplot-panel,digrich-bubblechart-panel,michaeldmoore-annunciator-panel"
    ```
* Now push both built image in our scenario `hassanfarid/cb_frontend:v6.7.2-1` and `hassanfarid/cb_frontend:v6.7.2-2` to docker hub

* Finally update repository description
