class Utils {

  static getParam(paramId){
    const query = location.search.substr(1, location.search.length - 1);
    const params = query.split('&');
    let id = undefined;
    params.map(param => {
      const pair = param.split('=');
      if (decodeURIComponent(pair[0]) === paramId) {
          id = decodeURIComponent(pair[1]);
      }
    });
    return id;
  }
}