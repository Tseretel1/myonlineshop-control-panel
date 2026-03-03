import { Component, HostListener, OnInit } from '@angular/core';
import { GetOrderDto, GetPost, OrderProduct, PostService, StartEndDate } from '../../shared/services/post.service';
import { CommonModule, DatePipe } from '@angular/common';
import { PhotoAlbumComponent } from "../../shared/components/photo-album/photo-album.component";
import { FormsModule } from '@angular/forms';
import { RouterLink } from "@angular/router";
import { AppRoutes } from '../../shared/AppRoutes/AppRoutes';
import { dateTimestampProvider } from 'rxjs/internal/scheduler/dateTimestampProvider';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit{
  ngOnInit(): void {
    this.getOrdersMainMethod();
  }

  getOrdersMainMethod(){
    const userId = localStorage.getItem('userIdToGetOrders');
    if(userId){
      this.getOrderDto.UserId =Number(userId);
      this.getOrderDto.IsPaid = null;
      this.UserIdOrderSearch();
      this.getOrderStatuses();
      this.generateMonthsList();
      this.setStats();
    }
    else{
      this.getOrdersLocalstorage();
      this.getOrderStatuses();
      this.generateMonthsList();
      this.setStats();
    }
  }

  setStats(){
    this.generateYearsList();
    this.getDashboardStats();
  }
  AppRoutes = AppRoutes;
  constructor(private service: PostService){

  }

  totalCount:number = 0;
  orders:OrderProduct []=[]
  getOrderDto:GetOrderDto={
    UserId : null,
    IsPaid : false,
    OrderId : null,
    PageNumber : 1,
    PageSize : 25,
  }

  today: Date = new Date();


  lastPage: number = 0; 
  selectedPage: number = 1;
  pageNumber: number = 1;
  changePage(page: number) {
    if (page < 1 || page > this.lastPage) return;
    this.selectedPage = page;
    this.getOrderDto.PageNumber = page;
    const middle = this.pageNumber + 2;
    if (page > middle) {
      this.pageNumber = page - 2;
    } else if (page < middle && this.pageNumber > 1) {
      this.pageNumber = Math.max(1, page - 2);
    }
    localStorage.setItem('PageNumber', this.selectedPage.toString());
    this.scrollTotop();
    this.getOrdersLocalstorage();
  }
 
  totalPages:number =0;
  groupedOrders: {
  monthLabel: string;
  orders: OrderProduct[];
  }[] = [];

  getOrders(){
    const pageNum= localStorage.getItem('PageNumber');
    if(pageNum){
      this.selectedPage = Number(pageNum);
      this.getOrderDto.PageNumber = Number(pageNum); 
    }
    this.service.getUserOrders(this.getOrderDto).subscribe(
      (resp)=>{
        if (!resp) {
          this.totalCount = 0;
          this.totalPages = 0;
          this.lastPage = 0;
          localStorage.removeItem('PageNumber');
          this.getOrderDto.PageNumber = 1;
          this.orders = [];
          this.groupedOrders = [];
          return;
        }
        this.orders = resp.orders;
        this.totalCount = resp.totalCount;
        this.totalPages = Math.ceil(this.totalCount / this.getOrderDto.PageSize);
        this.lastPage = Math.ceil(this.totalCount / this.getOrderDto.PageSize);
        this.groupOrdersByMonth();
        localStorage.removeItem('userIdToGetOrders');
      }
    )
  }

groupOrdersByMonth() {
  const map = new Map<string, OrderProduct[]>();

  for (const order of this.orders) {
    const date = new Date(order.createDate);
    const monthIndex = date.getMonth(); // 0–11
    const year = date.getFullYear();
    const key = `${year}-${monthIndex}`;

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)!.push(order);
  }

  this.groupedOrders = Array.from(map.entries())
    .map(([key, orders]) => {
      const [year, monthIndex] = key.split('-').map(Number);

      const georgianMonth =
        this.MonthsList.find(m => m.id === monthIndex + 1)?.MonthName
        ?? '';

      return {
        monthLabel: `${georgianMonth} ${year}`,
        orders
      };
    })
    .sort((a, b) =>
      new Date(b.orders[0].createDate).getTime() -
      new Date(a.orders[0].createDate).getTime()
    );
}


  selectedFilter:number = 1;
  getOrdersLocalstorage(){
    const ispaid = localStorage.getItem('orderIdPaid');
    if(ispaid =='true'){
      this.getPaidOrUnpaidOrders(true);
      return;
    }
    this.getPaidOrUnpaidOrders(false);
    return;
  }


  getPaidOrUnpaidOrders(IsPaid:boolean){
    this.getOrderDto.OrderId = null;
    this.getOrderDto.UserId = null
    this.pageNumber =1;
    this.selectedPage =1;  
    if(IsPaid){
      this.selectedFilter = 1;
      localStorage.setItem('orderIdPaid', 'true');
      this.getOrderDto.IsPaid = true;
      this.getOrders();
      return
    }
    else{
      this.selectedFilter = 0;
      localStorage.setItem('orderIdPaid', 'false');
      this.getOrderDto.IsPaid = false;
      this.getOrders();
    }
    return
  }

  orderSearchNum !:number;
  OrderSearch(){
    this.getOrderDto.UserId  = null;
    this.getOrderDto.OrderId = this.orderSearchNum;
    this.getOrders();
  }
  UserIdSearch !:number;
  UserIdOrderSearch(){
    this.getOrderDto.OrderId = null;
    // this.getOrderDto.UserId = this.UserIdSearch;
    this.getOrders();
  }

  orderStatuses:orderStatuses[]= [];
  getOrderStatuses(){
    this.service.getOrderStatuses().subscribe(
      (resp)=>{
        this.orderStatuses = resp;
      }
    )
  }


  getStatusName(statusid:number){
    const name  = this.orderStatuses.find((x)=> x.id == statusid);
    return name?.statusName;
  }

 getTimeAgo(dateString: string): string {
  const inputDate = new Date(dateString);
  const now = new Date();

  const diffInMs = now.getTime() - inputDate.getTime();
  if (diffInMs < 0) {
    const diffFuture = Math.abs(diffInMs);
    const days = Math.floor(diffFuture / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffFuture / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffFuture / (1000 * 60)) % 60);

    if (days > 0) return `${days} დღის${days > 1 ? 's' : ''} from now`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} from now`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} from now`;
    return 'Just now';
  }

  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffInMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffInMs / (1000 * 60)) % 60);

  if (days > 0) {
    return `${days}d${days > 1 ? '' : ''} ${hours}h${hours !== 1 ? '' : ''} ago`;
  } else if (hours > 0) {
    return `${hours}h${hours > 1 ? '' : ''} ${minutes}m${minutes !== 1 ? '' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes}m${minutes > 1 ? '' : ''} ago`;
  } else {
    return 'just now';
  }
}


isOlderThan1Day(dateString: string | Date): boolean {
  const inputDate = new Date(dateString);
  const today = new Date();
  const diffInMs = today.getTime() - inputDate.getTime();
  const diffInDays = diffInMs / 86400000;
  return diffInDays > 1;
}
isOlderThan7Day(dateString: string | Date): boolean {
  const inputDate = new Date(dateString);
  const today = new Date();
  const diffInMs = today.getTime() - inputDate.getTime();
  const day7 = 7 * 86400000;
  const diffInDays = diffInMs / day7;
  return diffInDays > 1;
}


 scrollTotop(){
     window.scrollTo({ top: 0, behavior: 'smooth' });
 }


  startDate:string= '';
  endDate: string = '';

  dashboardStats:Dashboard={
    totalPaidAmount : 0,
    totalUnPaidAmount : 0,
    paidOrdersCount:0,
    unpaidOrdersCount:0,
  }

dateBulilder() {
  const startMonthString = this.startMonthNum.toString().padStart(2, '0');
  const endMonthString = this.endMonthNum.toString().padStart(2, '0');
  this.startDate = `${this.currentYear}-${startMonthString}-01`;

  const currentMonth = new Date().getMonth() + 1; 

  if (this.endMonthNum === currentMonth) {
    const today = new Date().getDate().toString().padStart(2, '0');  
    this.endDate = `${this.currentYear}-${endMonthString}-${today}`;
  } else {
    const lastDay = new Date(this.currentYear, this.endMonthNum, 0)
      .getDate()
      .toString()
      .padStart(2, '0');  

    this.endDate = `${this.currentYear}-${endMonthString}-${lastDay}`;
  }
}


  getDashboardStats(){
    this.dateBulilder();
    const dashboard:StartEndDate={
      startDate :this.startDate,
      endDate :this.endDate,
    }
    this.service.GetDahsboardStatistics(dashboard).subscribe(
      (resp)=>{
        this.dashboardStats = resp.statistics;
      }
    )
  }
  MonthsList: Months[] = [];
  generateMonthsList() {
    const names = [
      'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
      'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
    ];
    names.forEach((element, index) => {
      const insertMonth: Months = {
        id: index + 1,
        MonthName: element,
      };
      this.MonthsList.push(insertMonth);
    });
  }

  startMonthNum:number = new Date().getMonth()+ 1;
  endMonthNum:number =new Date().getMonth() + 1;
  getStartMothName(): string | undefined {
    const found = this.MonthsList.find(m => m.id === this.startMonthNum);
    return found?.MonthName;
  }
  getEndMonthName(): string | undefined {
    const found = this.MonthsList.find(m => m.id === this.endMonthNum);
    return found?.MonthName;
  }
  thisLastDay:number = 0;
  getEndDay(){
    if (this.endMonthNum === new Date().getMonth()+1) {
      this.thisLastDay = new Date().getDate();
    } else {
      this.thisLastDay =new Date(this.currentYear, this.endMonthNum, 0).getDate(); 
    }
  }
  Years:number[]=[]
  currentYear:number = 0;
  generateYearsList() {
    const currentYear = new Date().getFullYear();
    this.currentYear = currentYear;
    this.Years = []; 
    for (let i = 0; i <= 5; i++) {
      this.Years.push(currentYear - i);
    }
  }

  orderPrices(order: OrderProduct[]): number {
    return order.reduce((total, x) => total + x.finalPrice, 0);
  }


}
export interface orderStatuses{
 id:number;
 statusName:string;
}

export interface Dashboard{
  totalPaidAmount:number;
  totalUnPaidAmount:number;
  paidOrdersCount:number;
  unpaidOrdersCount:number;
}

export interface Months{
  id:number;
  MonthName:string;
}