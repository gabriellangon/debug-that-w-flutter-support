public class ThreadApp {
    public static void main(String[] args) throws Exception {
        Thread t = new Thread(() -> {
            int x = 1;
            System.out.println("thread: x=" + x);
        });
        t.start();
        t.join();
        System.out.println("done");
    }
}
