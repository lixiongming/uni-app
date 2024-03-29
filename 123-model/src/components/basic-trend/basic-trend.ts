import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  AfterViewChecked,
  SimpleChanges
} from '@angular/core';
import {AboutService} from "../../pages/about/about.service";
import {AlertService} from "../../service/alert.service";
import {LoadingController} from "ionic-angular";
import {StorageService} from "../../service/storage.service";
/**
 * Generated class for the BasicTrendComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
declare var $: any;

@Component({
  selector: 'basic-trend',
  templateUrl: 'basic-trend.html'
})
export class BasicTrendComponent implements OnInit, OnChanges,OnDestroy, AfterViewChecked {

  // text: string;
  @Input() code;
  @Input() date;
  @Input() current_number;
  public showFilter = -1;
  private mainData: any = {};
  private tGoal = 0;//0第一球 1第二球 2第三球 3第四球 4 第五球
  private tPeriods = 30;
  private filterRs: any = {
    missing: true,//遗漏
    disassemble: true,//拆线
    missingLayer: false,//遗漏分层
    dividingLine: false//分割线
  };
  private temRs: any = {};
  private change = 0;
  private codeType: number;
  private loading;

  constructor(private aboutService: AboutService, private alertService: AlertService, private loadingCtrl: LoadingController,private localStorage:StorageService) {
    console.log('Hello BasicTrendComponent Component');
  }

  ngAfterViewChecked() {
    if (this.change == 1 || this.filterRs.disassemble || !this.filterRs.missing) {
      $("#" + this.code).find("canvas").remove();
      this.hotSpanDrawLine();
      this.filterCtrl();
    }
  }

  ngOnInit() {
    let allTypes = this.localStorage.getObject("analysisKinds")["jbzs"];
    // Detail-01 :北京PK10(bjpks) 澳洲幸运10(ajxys) 极速赛车(jssc) 极速飞艇(jsft)（4）
    // Detail-02:重庆时时彩(cqssc) 天津时时彩(tjssc) 新疆时时彩(xjssc) 极速时时彩(jsssc) 重庆七星彩(cqqxc) 澳洲幸运5(ajxyw)（6）
    if (allTypes["type1"].indexOf(this.code) != -1) {
      this.codeType = 1;
    }else if (allTypes["type2"].indexOf(this.code) != -1) {
      // if(['cqssc','tjssc','xjssc','jsssc','cqqxc','ajxyw'].indexOf(this.code)!=-1){
      this.codeType = 2;
    }else if(allTypes["type3"].indexOf(this.code) != -1) {
      this.codeType = 3;
    }else if(allTypes["type4"].indexOf(this.code) != -1) {
      this.codeType = 4;
    }
  }

  hotSpanDrawLine() {
    $("#" + this.code).find(".allNumber").eq(0).find("tr").each(function () {
      let tds = $(this).find("td");
      tds.each(function (i) {
        if (i > 1 && $(this).text().trim() == '0') {
          $(this).html(tds.eq(1).html());
          $(this).addClass("hot");
        }
      });
    });
    this.lineToChart();
  }


  lineToChart() {
    let hot = $("#" + this.code).find('.hot');
    if (hot.length > 1) {
      for (let i = 1; i < hot.length; i++) {
        this.line(hot[i - 1], hot[i], 1, "#0092e0");
      }
    }
  }

  line(header, footer, line_width, line_color) {
    let xstart = 0;
    let xpos = 0;
    let ypos = 9;
    let canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.visibility = "visible";
    canvas.height = 25;
    if (header.offsetLeft < footer.offsetLeft) {
      canvas.style.top = (13 + header.offsetTop) + "px";
      canvas.style.left = (22 + header.offsetLeft) + "px";
      canvas.width = (footer.offsetLeft - header.offsetLeft);
      xpos = footer.offsetLeft - header.offsetLeft - 14;
      ypos = 25;
    } else if (header.offsetLeft == footer.offsetLeft) {
      canvas.height = 13;
      canvas.style.top = (21 + header.offsetTop) + "px";
      canvas.style.left = (12 + header.offsetLeft) + "px";
      canvas.width = 10;
    } else {
      ypos = 25;
      canvas.style.top = (13 + header.offsetTop) + "px";
      canvas.style.left = (22 + footer.offsetLeft) + "px";
      canvas.width = (header.offsetLeft - footer.offsetLeft);
      xstart = header.offsetLeft - footer.offsetLeft - 14;
    }
    let ctx = canvas.getContext('2d');
    // ctx.clearRect(0,0,xpos,ypos); //清空画布，多个表格时使用
    ctx.fill();
    ctx.lineWidth = line_width;
    ctx.strokeStyle = line_color;
    ctx.beginPath();
    ctx.moveTo(xstart, 0);
    ctx.lineTo(xpos, ypos);
    ctx.stroke();
    ctx.closePath();
    $("#" + this.code).find("#chartLinediv").append(canvas);
  }

  //滚动到底部
  goBottom() {
    $("#" + this.code).find("#chartbottom")[0].scrollIntoView();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.code && this.date && this.current_number) {
      // this.loading = this.loadingCtrl.create({
      //   spinner: 'dots',
      //   content: '玩命加载中'
      // });
      // this.loading.present();
      this.getAnalysisDetail();
    }
  }

  ngOnDestroy(){
    // this.loading.dismiss();
  }

  getAnalysisDetail() {
    let that: any = this;
    that.mainData = null;
    $("#" + that.code).find("canvas").remove();
    that.change++;
    that.aboutService.getAnalysisDetail(that.code, 'jbzs', that.date).then((res) => {
      if (res.code == 0) {
        if (that.codeType < 4) {
          if ((typeof res.data.list == 'object') && res.data.list.constructor == Array) {
            res.data.list.forEach((v) => {
              that.objectToArray(v.list.basic);
            });
            that.objectToArray(res.data.statistics.appear.basic);
            that.objectToArray(res.data.statistics.avg.basic);
            that.objectToArray(res.data.statistics.current.basic);
            that.objectToArray(res.data.statistics.maxAway.basic);
            that.objectToArray(res.data.statistics.max.basic);
            that.mainData = res.data;
            // that.loading.dismiss();
          } else {
            setTimeout(that.getAnalysisDetail(),500);
          }
        } else if(that.codeType == 4){
          res.data.list.forEach((v) => {
            let temp = [];
            Object.keys(v.list.cit).forEach(function (key) {
              temp.push(v.list.cit[key]);
            });
            v.list.cit = temp;
            v.list.is = v.list.is[0][0];
            v.list.un = v.list.un[0][0];
            v.list.pairs = v.list.pairs[0][0];
          });
          Object.keys(res.data.statistics).forEach(function (k) {
            let temp = [];
            Object.keys(res.data.statistics[k].cit).forEach(function (key) {
              temp.push(res.data.statistics[k].cit[key]);
            });
            res.data.statistics[k].cit = temp;
            res.data.statistics[k].is = res.data.statistics[k].is[0][0];
            res.data.statistics[k].un = res.data.statistics[k].un[0][0];
            res.data.statistics[k].pairs = res.data.statistics[k].pairs[0][0];
          });
          that.mainData = res.data;
          // that.loading.dismiss();
        }
      } else {
        // that.loading.dismiss();
        that.alertService.msg(res.msg);
      }


    }).catch(() => {
      // that.loading.dismiss();
      that.alertService.msg("网络异常，请稍后再试");
    });
  }

  choseGoal(n) {
    if (n != this.tGoal) {
      $("#" + this.code).find("canvas").remove();
      this.change++;
      this.tGoal = n;
      this.showFilter = -1;
      // this.hotSpanDrawLine();
    }
  }

  chosePeriods(p) {
    if (p != this.tPeriods) {
      $("#" + this.code).find("canvas").remove();
      this.change++;
      this.tPeriods = p;
      this.showFilter = -1;
      // this.hotSpanDrawLine();
      // this.filterCtrl();
    }
  }

  choseCon(n) {
    if (n == 3) {
      this.showFilter = 3;
      this.temRs = this.filterRs;
    } else if (n == -1) {
      this.showFilter = -1;
      this.temRs = {};
    } else {
      this.showFilter = -1;
      this.filterRs = this.temRs;
      this.filterCtrl();
    }
  }

  filterCtrl() {
    if (!this.filterRs.missing) {
      $("#" + this.code).find(".allNumber").eq(0).find("tr").each(function () {
        let tds = $(this).find("td");
        tds.each(function (i) {
          if (i > 1) {
            $(this).find("span").hide();
          }
        });
      });
      $(".hot").find("span").show();
    } else {
      $("#" + this.code).find(".allNumber").eq(0).find("tr").find("td").find("span").show();
    }
    if (this.filterRs.dividingLine) {
      if ($(".bold_top_border").length == 0) {
        $("#" + this.code).find(".allNumber").eq(0).find("tr").each(function () {
          if (Number($(this).find("td").eq(0).text().trim()) % 5 == 0) {
            $(this).addClass("bold_top_border");
          }
        });
      }
    } else {
      $("#" + this.code).find(".bold_top_border").removeClass("bold_top_border");
    }
    if (!this.filterRs.disassemble) {
      $("#" + this.code).find("canvas").remove();
      this.change++;
    } else {
      if ($("canvas").length == 0) {
        this.lineToChart();
      }
    }
    if (!this.filterRs.missingLayer) {
      $("#" + this.code).find(".purple").removeClass("purple");
    } else {
      if (this.mainData && this.mainData.list) {
        let temp = [];
        if (this.codeType < 4) {
          let s = this.codeType == 2 ? 0 : 1;
          let e = this.codeType == 2 ? 10 : this.codeType == 1 ? 11 : 12;
          for (let k = s; k < e; k++) {
            let flag = true;
            for (let i = 0; i < this.mainData.list.length; i++) {
              if (flag) {
                if (i == this.mainData.list.length - 1 || Number(this.mainData.list[i].num[this.tGoal]) == k) {
                  let item: any = {};
                  item.rows = i;
                  item.cols = k + 2 + (this.codeType == 2 ? 0 : -1);
                  temp.push(item);
                  flag = false;
                }
              }
            }
          }
        }else{
          for (let k = 0; k < 6; k++) {
            let flag = true;
            for (let i = 0; i < this.mainData.list.length; i++) {
              if (flag) {
                if (i == this.mainData.list.length - 1 || Number(this.mainData.list[i].list.cit[k].out)==0) {
                  let item: any = {};
                  item.rows = i;
                  item.cols = k + 2 ;
                  temp.push(item);
                  flag = false;
                }
              }
            }
          }
          for (let i = 0; i < this.mainData.list.length; i++) {
            if(i == this.mainData.list.length - 1 || Number(this.mainData.list[i].list.is)==0){
              temp.push({rows:i,cols:8});
              break;
            }
          }
          for (let i = 0; i < this.mainData.list.length; i++) {
            if(i == this.mainData.list.length - 1 || Number(this.mainData.list[i].list.un)==0){
              temp.push({rows:i,cols:9});
              break;
            }
          }
          for (let i = 0; i < this.mainData.list.length; i++) {
            if(i == this.mainData.list.length - 1 || Number(this.mainData.list[i].list.pairs)==0){
              temp.push({rows:i,cols:10});
              break;
            }
          }
        }
        temp.forEach((v) => {
          $("#" + this.code).find(".allNumber").eq(0).find("tr").each(function (i) {
            if (i < v.rows) {
              $(this).find("td").eq(v.cols).addClass("purple");
            }
          });
        });
      }
    }
  }

  objectToArray(objArr) {
    objArr.forEach((obj, k) => {
      if (obj.constructor != Array) {
        let basic = [];
        let sdic = Object.keys(obj).sort();//根据key排序
        for (let i = 0; i < sdic.length; i++) {
          basic.push(obj[sdic[i]]);
        }
        objArr[k] = basic;
      }
    });
  }
}
