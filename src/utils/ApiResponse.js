class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    ((this.statusCode = statusCode),
      (this.data = data),
      (this.message = message),
      (this.success = statusCode < 400));
  }
}
//learn about this.data in node or response refer chatgpt for better reponse