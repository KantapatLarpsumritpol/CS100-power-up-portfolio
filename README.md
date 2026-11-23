# CS100 Power Up Portfolio

## Project Overview

Power Up Portfolio is a web application for creating and managing Portfolios and Portfolio Items. Users can add Items, import Items from other groups, edit their Reflections, and export their own Portfolio as JSON.

The system stores data on the server, allowing users to access their Portfolios across different browsers and devices.

## 1. Installation

### Install Apache

```bash
sudo apt update
sudo apt install apache2 -y
sudo systemctl enable --now apache2
sudo systemctl status apache2
```

### Install PHP

```bash
sudo apt update
sudo apt install php libapache2-mod-php -y
php -v
sudo systemctl restart apache2
```

### Clone the Repository

```bash
cd /home/ubuntu/
git clone https://github.com/KantapatLarpsumritpol/CS100-power-up-portfolio.git
```

### Deploy the Web App

```bash
sudo cp -r CS100-power-up-portfolio/* /var/www/html/
```

### Set Up Server-side Storage

```bash
sudo mkdir -p /var/www/data
sudo chown www-data:www-data /var/www/data
```

## 2. Running the System

Open the Web App using the EC2 Public IP:

```
http://<EC2-Public-IP>/
```

## 3. Testing the System

1. Create two Portfolios.
2. Add at least two Portfolio Items to each Portfolio.
3. Refresh the website and verify that the data remains saved.
4. Open the Web App on another browser or device and verify that the same data is accessible.
5. Restart Apache and verify that the data persists.

```bash
sudo systemctl restart apache2
```

6. Reboot the EC2 instance and verify that the data persists.
7. Check the server-side JSON file.

```bash
cat /var/www/data/portfolios.json
```

## 4. Challenge Activity

### โยนบอลแยก Syntax

**วิธีเล่น:**

- มีบอลทั้งหมด 7 ลูก โดย 6 ลูกมี Syntax เขียนไว้ และอีก 1 ลูกให้ผู้เล่นคิด Syntax ขึ้นมาเอง
- โยนบอลลงถังให้ตรงกับประเภทของ Syntax ที่เขียนอยู่บนบอล
- สำหรับบอลที่คิด Syntax ขึ้นมาเอง ต้องโยนลงถังให้ถูกต้องตาม Syntax ที่คิด
- ทำกิจกรรมให้ครบภายใน 10 นาที

เมื่อทำ Challenge สำเร็จ ผู้เล่นจะได้รับ Portfolio Item JSON จากเจ้าของบูธเพื่อนำไป Import ใน Portfolio ของตนเอง

## 5. Portfolio Item Import/Export

### Import Portfolio Item

1. Complete a Challenge at another group's booth.
2. Obtain the Portfolio Item JSON from the host.
3. Copy the JSON.
4. Open your Portfolio Web App and paste it into the Import Textarea.
5. Click Import.
6. Select the Portfolio where you want to save the Item.
7. Review and edit the Reflection to match your experience.
8. Save the Item and refresh the website to verify that it is saved.

### Export My Portfolio

1. Open your Portfolio.
2. Click Export.
3. Download your Portfolio as `my-portfolio.json`.
4. Verify that the exported file contains your own Portfolio and its Items.