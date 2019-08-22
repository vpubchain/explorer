import http from 'js/utils/http'
import api from 'js/utils/api'
import coury from 'js/country'

$(document).ready(function(){
  var agenttable = $('#agent_table').dataTable( {  
    tableConfig: {
      tableData: [],
      columns: [
          {
            title: '序号',
            key: 'id'
          },
          {
            title: '代理',
            key: 'name',
            //type: 'html'
            render: (h, params) => {
              var datas = params.row.name.split('/');
              return h('Button', {
                props: {
                  type: 'text',
                  size: 'small'
                },
                style: {
                  //marginRight: '5px'
                },
                on: {
                  click: () => {
                  this.search("/"+datas[1]+"/");
                  }
                }
              }, datas[1])
            }
          },
          {
            title: '节点',
            key: 'node'
          }
      ]
  }
  });
  var countrytable = $('#country_table').dataTable( {  
    tableConfig: {
      tableData: [],
      columns: [
          {
              title: '序号',
              key: 'id'
          },
          {
              title: '国家',
              key: 'name',
              //type: 'html'
              render: (h, params) => {
                  var datas = params.row.name;
                  return h('Button', {
                      props: {
                          type: 'text',
                          size: 'small'
                      },
                      style: {
                          marginRight: '5px'
                      },
                      on: {
                          click: () => {
                              var datass=this.findLocation(datas);
                              this.search(datass);
                          }
                      }
                  }, datas)
              }
          },
          {
              title: '节点',
              key: 'node'
          }
      ]
    }
  });
  var networktable = $('#network_table').dataTable( {  
    tableConfig: {
      tableData: [],
      columns: [
          {
              title: '序号',
              key: 'id'
          },
          {
              title: '运营商',
              key: 'name',
              //type: 'html'
              render: (h, params) => {
                  var datas = params.row.name;
                  return h('Button', {
                      props: {
                          type: 'text',
                          size: 'small'
                      },
                      style: {
                          marginRight: '5px'
                      },
                      on: {
                          click: () => {
                              this.search(datas);
                          }
                      }
                  }, datas)
              }
          },
          {
              title: '节点',
              key: 'node'
          }
      ]
    }
  });
  var nodetable = $('#node_table').dataTable( {  
    pageIndex: 1,
    pageSize: 50,
    total: '',
    tableConfig: {
      tableData: [],
      columns: [
        {
          title: '地址',
          key: 'address',
          //type: 'html',
          render: (h, params) => {
            var html = "";
            var datas = params.row.address.split(' ');
            for (var i = 0; i < datas.length; i++) {
              html += "<p>" + datas[i] + "</p>"
            }
            let url = 'http://192.168.0.177:5000/vpbitnodes/api/v1.0/nodes/' + datas[0]
            return h('a', {
              attrs: {
                href: url,
                //target: '_black'
              },
              domProps: {
                innerHTML: html
              }
            })
          }
        },
        {
          title: '代理',
          key: 'agent'
        },
        {
          title: '高度',
          key: 'height',
          /*render: (h, params) => {
            let row = params.row;
            return h('div', [
              h('Button', {
                props: {
                  type: 'ghost',
                  size: 'small'
                },
                style: {
                  marginRight: '5px'
                },
                on: {
                  click: () => {
                    this.toCheckDetails(row.id);
                  }
                }
              }, '查看'),
              h('Button', {
                props: {
                  type: 'ghost',
                  size: 'small'
                },
                style: {
                  marginRight: '5px'
                },
                on: {
                  click: () => {
                    this.toEdit(row.id);
                  }
                }
              }, '编辑')
             ]);
            }*/
            /*render: (h,params)=> {
              return h('div',
              "abc"
              )
            }*/
        },
        {
          title: '位置',
          key: 'location',
          render: (h, params) => {
            var html = "";
            var datas = params.row.location.split('/');
            for (var i = 0; i < datas.length; i++) {
              if(datas[i]!='null') {
                html += "<p>" + datas[i] + "</p>"
              }
            }
            return h('div', {
              domProps: {
                innerHTML: html
              }
            })
          }
        },
        {
          title: '网络',
          key: 'network',
          type: 'html'
        }
      ]
    }
  });
});
