// prisma/seed.ts
import { PrismaClient, Level } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Categories ──
  const cats = await Promise.all([
    prisma.category.upsert({ where:{slug:'backend'}, update:{}, create:{name:'Backend',slug:'backend'} }),
    prisma.category.upsert({ where:{slug:'frontend'}, update:{}, create:{name:'Frontend',slug:'frontend'} }),
    prisma.category.upsert({ where:{slug:'devops'}, update:{}, create:{name:'DevOps',slug:'devops'} }),
    prisma.category.upsert({ where:{slug:'data-ai'}, update:{}, create:{name:'Data / AI',slug:'data-ai'} }),
  ]);
  const [backend, frontend, devops, dataAI] = cats;

  // ── Admin user ──
  const adminPw = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@devlearn.vn' },
    update: {},
    create: { name: 'Admin', email: 'admin@devlearn.vn', password: adminPw, role: 'ADMIN' },
  });

  // ── Demo user ──
  const demoPw = await bcrypt.hash('Demo@123', 10);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@devlearn.vn' },
    update: {},
    create: { name: 'Nguyễn Demo', email: 'demo@devlearn.vn', password: demoPw, role: 'USER' },
  });

  // ── Courses ──
  const coursesData = [
    {
      title: 'Python Fundamentals',
      slug: 'python-fundamentals',
      description: 'Khóa học Python toàn diện từ cơ bản đến nâng cao. Bao gồm OOP, xử lý file, API, và dự án thực tế.',
      shortDesc: 'Học Python từ zero đến hero với các dự án thực tế.',
      price: 499000, oldPrice: 999000,
      level: Level.BEGINNER,
      tags: ['Python','OOP','CLI'],
      categoryId: backend.id,
      sections: [
        { title: 'Bắt đầu với Python', lessons: ['Cài đặt & Hello World','Biến & kiểu dữ liệu','Vào ra (input/output)'] },
        { title: 'Cấu trúc điều khiển', lessons: ['Vòng lặp for & while','Điều kiện if/elif/else','List & Dictionary'] },
        { title: 'Hàm & Module', lessons: ['Định nghĩa hàm','Args & Kwargs','Import module'] },
        { title: 'OOP', lessons: ['Class & Object','Kế thừa','Encapsulation'] },
        { title: 'Dự án', lessons: ['Dự án To-do CLI','Dự án Weather App'] },
      ],
      quiz: [
        { question: 'Python dùng từ khóa gì để định nghĩa hàm?', options: ['function','def','fn','func'], answer: 1, position: 1 },
        { question: 'Kết quả của x = [1,2,3]; print(x[-1]) là?', codeSnippet: 'x = [1, 2, 3]\nprint(x[-1])', options: ['1','3','-1','Error'], answer: 1, position: 2 },
        { question: 'List comprehension nào tạo ra [0,1,4,9]?', options: ['[x*x for x in 4]','[x**2 for x in range(4)]','[x^2 for x in range(4)]','[x*2 for x in range(4)]'], answer: 1, position: 3 },
        { question: 'Decorator trong Python dùng để?', options: ['Khai báo biến','Bọc/mở rộng hành vi hàm','Định nghĩa kiểu mới','Import module'], answer: 1, position: 4 },
      ],
    },
    {
      title: 'React & TypeScript',
      slug: 'react-typescript',
      description: 'Xây dựng ứng dụng web hiện đại với React 18 và TypeScript. Bao gồm Hooks, Context, React Query, và deploy.',
      shortDesc: 'React 18 + TypeScript từ cơ bản đến production.',
      price: 699000, oldPrice: 1299000,
      level: Level.INTERMEDIATE,
      tags: ['React','TypeScript','Hooks'],
      categoryId: frontend.id,
      sections: [
        { title: 'React cơ bản', lessons: ['JSX & Components','Props & State','Event Handling'] },
        { title: 'React Hooks', lessons: ['useState & useEffect','useContext','Custom Hooks'] },
        { title: 'TypeScript', lessons: ['Types & Interfaces','Generics','TypeScript với React'] },
        { title: 'Data Fetching', lessons: ['React Query cơ bản','Mutations','Cache & Optimistic UI'] },
        { title: 'Deploy', lessons: ['Build & Optimize','Deploy lên Vercel'] },
      ],
      quiz: [
        { question: 'Hook nào dùng để lưu trạng thái trong functional component?', options: ['useEffect','useRef','useState','useContext'], answer: 2, position: 1 },
        { question: 'TypeScript khác JavaScript ở điểm nào?', options: ['Chạy nhanh hơn','Static type checking','Không cần Node','Chỉ backend'], answer: 1, position: 2 },
        { question: 'useEffect với [] chạy khi nào?', options: ['Mỗi render','1 lần sau mount','Khi unmount','Không bao giờ'], answer: 1, position: 3 },
        { question: 'Props drilling là gì?', options: ['Kỹ thuật tối ưu','Truyền props qua nhiều tầng','Loại hook','CSS method'], answer: 1, position: 4 },
      ],
    },
    {
      title: 'Docker & Kubernetes',
      slug: 'docker-kubernetes',
      description: 'Containerize và orchestrate ứng dụng với Docker và Kubernetes. Xây dựng CI/CD pipeline thực tế.',
      shortDesc: 'Từ Docker cơ bản đến K8s production-ready.',
      price: 799000, oldPrice: 1499000,
      level: Level.INTERMEDIATE,
      tags: ['Docker','K8s','CI/CD'],
      categoryId: devops.id,
      sections: [
        { title: 'Docker cơ bản', lessons: ['Container là gì?','Dockerfile','Docker Compose'] },
        { title: 'Kubernetes', lessons: ['K8s Architecture','Pods & Services','Deployments & ReplicaSets'] },
        { title: 'CI/CD', lessons: ['GitHub Actions','Automated Testing','Deploy Pipeline'] },
      ],
      quiz: [
        { question: 'Lệnh nào build Docker image?', codeSnippet: '# Từ thư mục chứa Dockerfile', options: ['docker run .','docker build .','docker create .','docker pull .'], answer: 1, position: 1 },
        { question: 'Kubernetes Pod là gì?', options: ['Máy chủ vật lý','Đơn vị deploy nhỏ nhất','Loại network','Loại storage'], answer: 1, position: 2 },
        { question: 'Docker Compose dùng để?', options: ['Build image','Chạy multi-container apps','Monitor logs','Security scan'], answer: 1, position: 3 },
        { question: 'Rolling update trong K8s là?', options: ['Xóa rồi tạo lại','Cập nhật dần từng pod','Backup dữ liệu','Scale ngang'], answer: 1, position: 4 },
      ],
    },
    {
      title: 'Machine Learning với Python',
      slug: 'machine-learning-python',
      description: 'Học Machine Learning từ cơ bản với Python, scikit-learn, và TensorFlow. Xây dựng và deploy model thực tế.',
      shortDesc: 'ML từ linear regression đến neural networks.',
      price: 999000, oldPrice: 1800000,
      level: Level.ADVANCED,
      tags: ['Python','sklearn','TensorFlow'],
      categoryId: dataAI.id,
      sections: [
        { title: 'Nền tảng', lessons: ['Numpy & Pandas','Data Visualization','Feature Engineering'] },
        { title: 'Supervised Learning', lessons: ['Linear Regression','Decision Trees','Random Forest'] },
        { title: 'Deep Learning', lessons: ['Neural Networks cơ bản','TensorFlow & Keras','CNN & RNN'] },
        { title: 'Deploy', lessons: ['Lưu & load model','REST API cho model','Deploy lên cloud'] },
      ],
      quiz: [
        { question: 'Overfitting xảy ra khi nào?', options: ['Model quá đơn giản','Model học thuộc training data','Dataset quá nhỏ','Learning rate nhỏ'], answer: 1, position: 1 },
        { question: 'Cross-validation dùng để?', options: ['Tăng tốc training','Đánh giá model tổng quát','Giảm model size','Xử lý missing data'], answer: 1, position: 2 },
        { question: 'Thuật toán nào là supervised learning?', options: ['K-means','PCA','Linear Regression','DBSCAN'], answer: 2, position: 3 },
        { question: 'Feature scaling quan trọng với?', options: ['Decision Tree','Random Forest','KNN & SVM','Naive Bayes'], answer: 2, position: 4 },
      ],
    },
  ];

  for (const cd of coursesData) {
    const existing = await prisma.course.findUnique({ where: { slug: cd.slug } });
    if (existing) continue;

    const course = await prisma.course.create({
      data: {
        title: cd.title, slug: cd.slug,
        description: cd.description, shortDesc: cd.shortDesc,
        price: cd.price, oldPrice: cd.oldPrice ?? null,
        level: cd.level, tags: cd.tags,
        isPublished: true,
        categoryId: cd.categoryId,
        instructorId: admin.id,
        totalLessons: cd.sections.reduce((s, sec) => s + sec.lessons.length, 0),
      },
    });

    // sections & lessons
    for (let si = 0; si < cd.sections.length; si++) {
      const sec = cd.sections[si];
      const section = await prisma.section.create({
        data: { title: sec.title, position: si + 1, courseId: course.id },
      });
      for (let li = 0; li < sec.lessons.length; li++) {
        await prisma.lesson.create({
          data: { title: sec.lessons[li], position: li + 1, sectionId: section.id, duration: 8 + li * 3, isFree: li === 0 },
        });
      }
    }

    // quiz
    const quiz = await prisma.quiz.create({ data: { courseId: course.id } });
    for (const q of cd.quiz) {
      await prisma.quizQuestion.create({
        data: { quizId: quiz.id, question: q.question, codeSnippet: q.codeSnippet ?? null, options: q.options, answer: q.answer, position: q.position },
      });
    }

    console.log(`  ✓ ${course.title}`);
  }

  // ── Enroll demo user in first course ──
  const firstCourse = await prisma.course.findUnique({ where: { slug: 'python-fundamentals' } });
  if (firstCourse) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: demo.id, courseId: firstCourse.id } },
      update: {},
      create: { userId: demo.id, courseId: firstCourse.id },
    });
  }

  console.log('✅ Seed complete!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
